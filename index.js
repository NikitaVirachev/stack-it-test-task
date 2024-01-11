const fs = require("fs");
const readline = require("readline");

// Пути к входному и выходному файлам
const dirPath = process.argv[2]; // Путь к директории с файлами
const inputFilePath = `${dirPath}/чеки.txt`; // Путь к входному файлу
const outputFilePath = `${dirPath}/чеки_по_папкам.txt`; // Путь к выходному файлу

/**
 * Извлекает название услуги и месяца из имени файла.
 * @param {string} filename - Имя файла для обработки.
 * @returns {object|null} Объект с названием услуги и месяца или null, если формат неверный.
 */
const extractServiceAndMonth = (filename) => {
  const serviceWithMonth = filename.split(".pdf")[0];
  const parts = serviceWithMonth.split("_");

  if (parts.length === 2) {
    return {
      service: parts[0],
      month: parts[1],
    };
  } else {
    return null;
  }
};

/**
 * Преобразует название месяца в числовой индекс.
 * @param {string} monthName - Название месяца.
 * @returns {number} Числовой индекс месяца.
 */
const getMonthNumber = (monthName) => {
  const months = {
    январь: 0,
    февраль: 1,
    март: 2,
    апрель: 3,
    май: 4,
    июнь: 5,
    июль: 6,
    август: 7,
    сентябрь: 8,
    октябрь: 9,
    ноябрь: 10,
    декабрь: 11,
  };

  monthName = monthName.toLowerCase();
  return months[monthName];
};

/**
 * Обрабатывает каждое имя файла, разделяя его на услугу и месяц и добавляя в структуру данных.
 * @param {string} fileName - Имя файла для обработки.
 * @param {array} receiptsByFolders - Массив для хранения информации о чеках по папкам.
 * @param {Set} servicesNames - Множество для хранения всех видов услуг.
 */
const parseFileName = (fileName, receiptsByFolders, servicesNames) => {
  const result = extractServiceAndMonth(fileName);

  if (!result) {
    console.log(`Строка не соответствует ожидаемому формату: ${fileName}`);
    return;
  }

  servicesNames.add(result.service);

  if (receiptsByFolders[getMonthNumber(result.month)]?.receipts) {
    receiptsByFolders[getMonthNumber(result.month)].receipts.push(fileName);
    receiptsByFolders[getMonthNumber(result.month)].services.push(
      result.service.toLowerCase()
    );
  } else {
    receiptsByFolders[getMonthNumber(result.month)] = {};
    receiptsByFolders[getMonthNumber(result.month)].receipts = [fileName];
    receiptsByFolders[getMonthNumber(result.month)].services = [
      result.service.toLowerCase(),
    ];
    receiptsByFolders[getMonthNumber(result.month)].month = result.month;
  }
};

/**
 * Создаёт итоговый текст для записи в файл.
 * @param {array} receiptsByFolders - Массив с информацией о чеках по папкам.
 * @param {Set} allServicesNames - Множество всех видов услуг.
 * @returns {string} Итоговый текст для записи.
 */
const createSummaryText = (receiptsByFolders, allServicesNames) => {
  let resultByFolders = "";
  let unpaidResult = "";

  receiptsByFolders.forEach((folder) => {
    if (folder === undefined) return;
    folder.receipts?.forEach((receipt) => {
      resultByFolders += `/${folder.month}/${receipt}\n`;
    });
    const unpaidServices = [...allServicesNames].filter(
      (service) => !folder.services?.includes(service.toLowerCase())
    );
    if (unpaidServices.length !== 0) {
      if (!unpaidResult) unpaidResult = "не оплачены:\n";
      unpaidResult += `${folder.month}:\n${unpaidServices
        .map((service) => `${service}\n`)
        .join("")}`;
    }
  });

  return resultByFolders + unpaidResult;
};

/**
 * Записывает текст в файл.
 * @param {string} filePath - Путь к файлу для записи.
 * @param {string} text - Текст для записи.
 */
const writeFile = (filePath, text) => {
  const writeStream = fs.createWriteStream(filePath);

  writeStream.write(text);

  writeStream.on("error", (error) => {
    console.error("Произошла ошибка при записи файла:", error);
  });

  writeStream.end();

  writeStream.on("finish", () => {
    console.log("Запись файла завершена.");
  });
};

/**
 * Читает входной файл и обрабатывает каждую строку.
 * @param {string} inputFilePath - Путь к входному файлу.
 * @param {string} outputFilePath - Путь к выходному файлу.
 */
const readFile = (inputFilePath, outputFilePath) => {
  const receiptsByFolders = [];
  const allServicesNames = new Set();

  if (!fs.existsSync(inputFilePath)) {
    console.error("Файл не найден:", inputFilePath);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(inputFilePath);

  fileStream.on("error", (error) => {
    console.error("Ошибка при чтении файла:", error);
    process.exit(1);
  });

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  rl.on("line", (line) => {
    parseFileName(line.trim(), receiptsByFolders, allServicesNames);
  });

  rl.on("error", (error) => {
    console.error("Ошибка в интерфейсе readline:", error);
    process.exit(1);
  });

  rl.on("close", () => {
    const text = createSummaryText(receiptsByFolders, allServicesNames);
    writeFile(outputFilePath, text);
  });
};

// Проверка на пустоту входного файла перед чтением
const fileStats = fs.statSync(inputFilePath);
if (fileStats.size === 0) {
  console.error("Файл пустой:", inputFilePath);
} else {
  readFile(inputFilePath, outputFilePath);
}
