# Скрипты (макросы) Google Spreadsheets

## Подсчет статистики в разрезе месяца

```js
function calculateTransactionsSummary() {
  const transactionsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("transactions");
  const transactions = 
    transactionsSheet.getRange('A2:F')
      .getValues()
      .filter(r => r[0] != "" && r[0] != null)
      .sort((a, b) => {
        const dateA = new Date(a[1]);
        const dateB = new Date(b[1]);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0;
        }
        return dateA - dateB;
      });
  Logger.log("transactions count: " + transactions.length)

  const minTransactionDate = new Date(Math.min(...transactions.map(row => new Date(row[1]))));
  const maxTransactionDate = new Date(Math.max(...transactions.map(row => new Date(row[1]))));
  Logger.log("transaction history is from " + minTransactionDate.toLocaleDateString('ru') + " to " + maxTransactionDate.toLocaleDateString('ru'));
  
  const transactionsByMonth = {}
  transactions.forEach((row) => {
    const date = new Date(row[1]) // row[1] is transaction date
    if (isNaN(date.getTime())) {
      throw Error("invalid date" + row[1] + " transaction " + row[0])
    }
    const year = date.getFullYear();
    const monthAbbreviation = getMonthAbbreviation(date.getMonth());
    const key = `${year}-${monthAbbreviation}`;
    if (!transactionsByMonth[key]) {
      transactionsByMonth[key] = [];
    }
    transactionsByMonth[key].push(row);
  })

  const categoryAmountsByMonth = {}
  Object.keys(transactionsByMonth).forEach((month) => {
    const mothTransaction = transactionsByMonth[month];
    const amountByCategory = {}
    mothTransaction.forEach((row) => {
      const category = row[4]
      const amount = row[5]
      if (!amountByCategory[category]) {
        amountByCategory[category] = 0
      }
      amountByCategory[category] = amountByCategory[category] + amount
    })
    categoryAmountsByMonth[month] = amountByCategory
  })

  const categoriesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("categories");
  const categories = categoriesSheet.getRange('A2:D').getValues().filter(r => r[0] != "").sort((a, b) => a[1].localeCompare(b[1])).sort((a, b) => a[0].localeCompare(b[0]));

  const getChildCategories = (category) => categories.filter((row) => row[2] == category);

  const getCategorySelfAmount = (category, month) => categoryAmountsByMonth[month][category]

  const getCategoryTotalAmount = (category, month) => {
    const selfAmount = getCategorySelfAmount(category, month)
    const childAmounts = getChildCategories(category).map((row) => {
      const categoryName = row[1]
      const relToParent = row[3]
      const amount = getCategoryTotalAmount(categoryName, month)
      if (relToParent == 'positive') return amount
      else return -amount
    })
    const childAmount = childAmounts.reduce((acc, v) => {
        if (v == null) return acc
        else if (acc == null) return v
        else return acc + v
      }, null)
    if (selfAmount == null) return childAmount
    else if (childAmount == null) return selfAmount
    else return childAmount + selfAmount
  }

  const yearSummarySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("month summary");
  const yearSummary = yearSummarySheet.getRange('A1')

  const months = Object.keys(categoryAmountsByMonth)
  yearSummary.offset(0, 3, 1, months.length).setValues([months])

  const outputData = []

  categories.forEach((catRow) => {
    const transactionType = catRow[0];
    const categoryName = catRow[1];
    const parentCategoryName = catRow[2];
    const relToParent = catRow[3];
    const amountByMonth = months.map((month) => {
      return getCategoryTotalAmount(categoryName, month)
    })
    outputData.push([transactionType, categoryName, parentCategoryName, ...amountByMonth]);
  })

  yearSummary.offset(1, 0, outputData.length, 3 + months.length).setValues(outputData);
}

function getMonthAbbreviation(monthIndex) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[monthIndex];
}
```