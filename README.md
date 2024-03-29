# Программа обработки чеков

Программа для обработки чеков по квитанциям, сканированных в общую папку. Программа анализирует файлы, сгруппированные по месяцам, и генерирует отчет о неоплаченных услугах.

## Функциональность

- Чтение списка имен файлов чеков из текстового файла.
- Группировка чеков по месяцам.
- Выявление и отчет о неоплаченных услугах в каждом месяце.
- Генерация итогового файла (`чеки_по_папкам.txt`) со списком чеков, организованных по папкам.

## Установка и Запуск

Для работы программы требуется Node.js.

1. Клонируйте репозиторий или скачайте исходные файлы программы.
2. Откройте терминал в папке проекта.
3. Убедитесь, что файл с чеками (`чеки.txt`) находится в нужной директории.
4. Запустите программу командой:

   ```bash
   node index.js <путь_к_папке_с_файлами>
   ```

   Например:

   ```bash
   node index.js ./data
   ```

# SQL

Решение заданий находиться в файле `test_sql.sql`.
