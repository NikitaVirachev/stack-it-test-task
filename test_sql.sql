---------------------------------------------------------------------------------------------------

/*
Задание 1.

Написать функцию stack.select_count_pok_by_service. Она получает номера услуг строкой и дату
и возвращает количество показаний по услуге для каждого лицевого счёта.
Результатом вызова функции должна быть таблица с 4 колонками:
- acc (Лицевой счет)
- serv (Услуга)
- count (Количество показаний)
*/

CREATE OR REPLACE FUNCTION stack.select_count_pok_by_service(service_param text, date_param date)
RETURNS TABLE (acc int, serv int, count bigint) AS $$
BEGIN
	RETURN QUERY 
   SELECT Accounts.number, Counters.service, COUNT(Accounts.number) 
	FROM stack.Meter_Pok 
	JOIN stack.Counters ON Meter_Pok.counter_id = Counters.row_id
	JOIN stack.Accounts ON Meter_Pok.acc_id = Accounts.row_id
	WHERE Counters.service = service_param::int AND Meter_Pok.month = date_param
	GROUP BY Accounts.number, Counters.service;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM stack.select_count_pok_by_service('300','20230201');

---------------------------------------------------------------------------------------------------

/*
Задание 2

Написать функцию select_value_by_house_and_month. 
Она получает номер дома и месяц и возвращает все лицевые в этом доме. 
Для лицевых выводятся все счетчики с сумарным расходом за месяц (суммируя все показания тарифов).
Результатом вызова функции должна быть таблица с 3 колонками:

- acc (Лицевой счет)
- name (Наименование счетчика)
- value (Расход)
*/

CREATE OR REPLACE FUNCTION stack.select_value_by_house_and_month(house_number int, date_param date)
RETURNS TABLE (acc int, name text, value bigint) AS $$
BEGIN
	RETURN QUERY
	WITH RECURSIVE Account_Tree AS (
		SELECT row_id, parent_id, number, type
		FROM stack.Accounts
		WHERE number = house_number AND type = 1

		UNION ALL

		SELECT A.row_id, A.parent_id, A.number, A.type
		FROM stack.Accounts A
		JOIN Account_Tree A_T ON A.parent_id = A_T.row_id
		WHERE A.type IN (2, 3)
	) 
   SELECT Account_Tree.number, Counters.name, SUM(Meter_pok.value)
	FROM stack.Meter_Pok 
	JOIN stack.Counters ON Meter_Pok.counter_id = Counters.row_id
	JOIN Account_Tree ON Meter_Pok.acc_id = Account_Tree.row_id
	WHERE Meter_Pok.month = date_param AND Account_Tree.type = 3
	GROUP BY Account_Tree.number, Counters.name;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM stack.select_value_by_house_and_month(1,'20230201');

---------------------------------------------------------------------------------------------------

/* 
Задание 3

Написать функцию stack.select_last_pok_by_acc. Она получает номер лицевого
и возвращает дату,тариф,объем последнего показания по каждой услуге
Результатом вызова
функции должна быть таблица с 5 колонками:
- acc (Лицевой счет)
- serv (Услуга)
- date (Дата показания)
- tarif (Тариф показания)
- value (Объем)
*/

CREATE OR REPLACE FUNCTION stack.select_last_pok_by_acc(acc_number int)
RETURNS TABLE (acc int, serv int, date date, tarif int, value int) AS $$
BEGIN
    RETURN QUERY
    SELECT A.number, C.service, MP.date, MP.tarif, MP.value
    FROM stack.Accounts A
    JOIN stack.Meter_Pok MP ON A.row_id = MP.acc_id
    JOIN stack.Counters C ON MP.counter_id = C.row_id
    WHERE A.number = acc_number AND
		(MP.acc_id, MP.counter_id, MP.date, MP.tarif) IN (
			SELECT MP2.acc_id, MP2.counter_id, MAX(MP2.date), MP2.tarif
			FROM stack.Meter_Pok MP2
			GROUP BY MP2.acc_id, MP2.counter_id, MP2.tarif
		);
END;
$$ LANGUAGE plpgsql;

SELECT * FROM stack.select_last_pok_by_acc(144);