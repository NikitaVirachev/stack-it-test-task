const fs = require("fs");
const readline = require("readline");

const dirPath = process.argv[2];
const inputFilePath = `${dirPath}/чеки.txt`;
const outputFilePath = `${dirPath}/чеки_по_папкам.txt`;

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

const parseFileName = (fileName, receiptsByFolders, servicesNames) => {
  const result = extractServiceAndMonth(fileName);

  if (!result) {
    console.log("Строка не соответствует ожидаемому формату");
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

readFile(inputFilePath, outputFilePath);
