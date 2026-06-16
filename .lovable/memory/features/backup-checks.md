---
name: Проверки бэкапов через SFTP-хранилища
description: Подключения к tftp-root по SFTP, поля бэкапа на оборудовании, edge-функция и cron, покрытие регламента
type: feature
---

## Подключения
- Раздел «Подключения → Хранилища бэкапов» (admin only).
- Таблица `backup_storage_connections`: host, port=22, username, auth_method (password|key), base_path (обычно `/srv/tftp`).
- TFTP по UDP edge-функция не читает — нужен sshd на тот же хост, SFTP видит каталог tftp-root.
- Пароль/приватный ключ хранятся в БД, RLS только admin. При редактировании пустое поле не перезаписывает существующее значение.
- Кнопка «Проверить подключение» вызывает edge-функцию с `action:"test"`.

## Привязка на карточке оборудования
Поля: `backup_storage_id`, `backup_path` (с подстановками `{name}`/`{model}`/`{serial}`; завершение `/` = каталог, иначе точный файл),
`backup_extensions[]`, `backup_max_age_hours` (default 24), `backup_min_size_kb` (default 1),
`backup_md5_source` (`sidecar` — рядом `.md5` файл, `stored` — эталон в `backup_md5_expected`, `none`).

## Edge-функция `backup-storage-check`
- `npm:ssh2-sftp-client@10.0.3` + `node:crypto`.
- Actions: `test` (одно хранилище), `check_equipment` (одно устройство), `check_all` (всё, для cron).
- Скачивает файл (cap 256 МБ), считает md5, пишет результат в `equipment_backup_checks`.
- Статусы: `ok`, `stale`, `missing`, `checksum_mismatch`, `error`.

## Cron
`pg_cron` job `backup-storage-hourly-check`, расписание `7 * * * *`, вызов через `pg_net.http_post` с anon-ключом.

## Покрытие регламента
`isBackupTask` (src/lib/backup-task-detect.ts) распознаёт работы по бэкапу из названия/описания; задача считается покрытой автоматически — статус «Бэкап» (amber). Список последних проверок виден в колонке «Бэкап» на странице оборудования.