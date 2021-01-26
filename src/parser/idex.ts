import P, { TypedLanguage } from 'parsimmon'

const transactionTypes = ["доходы", "затраты"]
const categoriesByTransactionType = {
    "доходы": ["зарплата"],
    "затраты": ["продукты", "автомобиль", "жилье"]
}

const currencies = ["руб.", "руб", "рублей", "р.", "р"]

export class Transaction {
    category: string
    amountOfMoney: number
    comment?: string

    constructor(category: string, amountOfMoney: number, comment?: string) {
        this.category = category
        this.amountOfMoney = amountOfMoney
        this.comment = comment
    }
}

export const TransactionParser = P.createLanguage({
    category: () =>
        P.alt(
            ...[
                ...categoriesByTransactionType.доходы,
                ...categoriesByTransactionType.затраты
            ].sort((a, b) => b.length - a.length).map(P.string)),
    number: () => P.regexp(/-?(0|[1-9][0-9]*)([.,][0-9]+)?([eE][+-]?[0-9]+)?/).map(n => Number(n.replace(/,/, '.'))).desc("number"),
    currency: () => P.alt(...currencies.sort((a, b) => b.length - a.length).map(P.string)),
    amountOfMoney: (l) => l.number.skip(P.optWhitespace.then(l.currency).fallback(null)),
    comment: () => P.any.atLeast(1).tie(),
    transaction: (l) =>
        P.alt(
            P.seqMap(
                l.category,
                P.whitespace,
                l.amountOfMoney,
                P.whitespace.then(l.comment).fallback(undefined),
                (category, _, amountOfMoney, comment) => new Transaction(category, amountOfMoney, comment)),
            P.seqMap(
                l.amountOfMoney,
                P.whitespace,
                l.category,
                P.whitespace.then(l.comment).fallback(undefined),
                (amountOfMoney, _, category, comment) => new Transaction(category, amountOfMoney, comment)))
})

