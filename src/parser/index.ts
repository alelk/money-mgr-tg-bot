import P from 'parsimmon'
import { Category, TransactionType } from '../model'
import { ParsedTransaction } from '../model/parsed'

const currencies = ["руб.", "руб", "рублей", "р.", "р"]

interface TransactionSpec {
    category: Category,
    number: number,
    currency: string,
    amountOfMoney: number,
    amountOfMoneyExpr: number,
    comment: string,
    date: Date,
    transaction: ParsedTransaction
}

function stringIgnoreCase(str: string) {
    var expected = "'" + str + "'";
    return P((input, i) => {
        var j = i + str.length;
        var head = input.slice(i, j);
        if (head.toLowerCase() === str.toLowerCase()) {
            return P.makeSuccess(j, head);
        } else {
            return P.makeFailure(i, expected);
        }
    });
}

export function transactionParser(categories: Category[]) {
    return P.createLanguage<TransactionSpec>({
        category: () =>
            P.alt(
                ...categories
                    .map(c => [c.name, ...c.synonyms])
                    .reduce((a, b) => a.concat(b), [])
                    .sort((a, b) => b.length - a.length)
                    .map(stringIgnoreCase))
                .map(c =>
                    categories.find(v =>
                        [v.name.toLowerCase(), ...v.synonyms.map(s => s.toLowerCase())].includes(c.toLowerCase()))!),
        number: () => P.regexp(/-?(0|[1-9][0-9]*)([.,][0-9]+)?([eE][+-]?[0-9]+)?/).map(n => Number(n.replace(/,/, '.'))).desc("число"),
        currency: () =>
            P.alt(
                ...currencies
                    .sort((a, b) => b.length - a.length)
                    .map(stringIgnoreCase)),
        amountOfMoney: (l) => l.number.skip(P.optWhitespace.then(l.currency).fallback(null)),
        amountOfMoneyExpr: (l) => P.seqMap(
            l.amountOfMoney,
            P.regexp(/[+-]/).trim(P.optWhitespace),
            l.amountOfMoneyExpr,
            (a, op, b) => op === "+" ? a + b : a - b).or(l.amountOfMoney),
        comment: () => P.any.atLeast(1).tie(),
        date: () =>
            P.alt(
                stringIgnoreCase("вчера").map(() => {
                    const d = new Date(); d.setDate(d.getDate() - 1); return d
                }),
                stringIgnoreCase("позавчера").map(() => {
                    const d = new Date(); d.setDate(d.getDate() - 2); return d
                }),
                P.digits
                    .skip(P.optWhitespace.then(P.regexp(/дн(я|ей) назад/i)))
                    .desc("дата, например '5 дней назад' или 'вчера'").map((n) => {
                        const d = new Date(); d.setDate(d.getDate() - Number.parseInt(n)); return d
                    })),

        transaction: (l) =>
            P.alt(
                P.seqMap(
                    l.date.skip(P.whitespace).fallback(undefined),
                    l.category,
                    P.whitespace,
                    l.amountOfMoneyExpr,
                    P.whitespace.then(l.comment).fallback(undefined),
                    (date, category, _, amountOfMoney, comment) => new ParsedTransaction(category, amountOfMoney, comment, date)),
                P.seqMap(
                    l.date.skip(P.whitespace).fallback(undefined),
                    l.amountOfMoneyExpr,
                    P.whitespace,
                    l.category,
                    P.whitespace.then(l.comment).fallback(undefined),
                    (date, amountOfMoney, _, category, comment) => new ParsedTransaction(category, amountOfMoney, comment, date)))
    })
}

