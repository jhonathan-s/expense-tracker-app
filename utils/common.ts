export const getLast7Days = () => {
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    result.push({
      day: daysOfWeek[date.getDay()],
      date: date.toISOString().split("T")[0],
      income: 0,
      expense: 0,
    });
  }
  return result;
};

export const getLast12Months = () => {
  const monthsOfYear = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const result = [];
  const currentYear = new Date().getFullYear();
  const shortYear = currentYear.toString().slice(-2);

  for (let month = 0; month < 12; month++) {
    const date = new Date(currentYear, month, 1);
    const monthName = monthsOfYear[month];
    const formattedMonthYear = `${monthName} ${shortYear}`;
    const formattedDate = date.toISOString().split("T")[0];

    result.push({
      month: formattedMonthYear,
      fullDate: formattedDate,
      income: 0,
      expense: 0,
    });
  }

  return result;
};

export const getYearsRange = (startYear: number, endYear: number): any => {
  const result = [];
  for (let year = startYear; year <= endYear; year++) {
    result.push({
      year: year.toString(),
      fullDate: `01-01-${year}`,
      income: 0,
      expense: 0,
    });
  }
  return result;
};
