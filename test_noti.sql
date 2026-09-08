USE smartloan;
UPDATE emi_schedule SET due_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY) WHERE id = 33;
