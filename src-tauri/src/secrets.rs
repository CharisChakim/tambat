use keyring::Entry;

/// Penyimpanan rahasia opsional per host di keyring sistem (Secret Service /
/// GNOME Keyring). Kunci entri = id host. Operasi DBus bersifat blocking,
/// jadi semua command dijalankan lewat spawn_blocking.
const SERVICE: &str = "tambat";

fn entry(id: &str) -> Result<Entry, String> {
    Entry::new(SERVICE, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn secret_set(id: String, secret: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        entry(&id)?
            .set_password(&secret)
            .map_err(|e| format!("Gagal menyimpan ke keyring: {}", e))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn secret_get(id: String) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || match entry(&id)?.get_password() {
        Ok(s) => Ok(Some(s)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("Gagal membaca keyring: {}", e)),
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::entry;

    /// Butuh Secret Service (keyring GNOME) di sesi aktif: cargo test -- --ignored
    #[test]
    #[ignore]
    fn siklus_keyring() {
        let id = "tambat-test-siklus";
        let e = entry(id).unwrap();
        e.set_password("rahasia-uji").unwrap();
        assert_eq!(entry(id).unwrap().get_password().unwrap(), "rahasia-uji");
        entry(id).unwrap().delete_credential().unwrap();
        assert!(matches!(
            entry(id).unwrap().get_password(),
            Err(keyring::Error::NoEntry)
        ));
    }
}

#[tauri::command]
pub async fn secret_delete(id: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || match entry(&id)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(format!("Gagal menghapus dari keyring: {}", e)),
    })
    .await
    .map_err(|e| e.to_string())?
}
