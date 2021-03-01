import P from 'parsimmon'
import { Category, CategorySynonym } from '../model'
import { ParsedTransaction, ParsedCategory } from '../model/parsed'

const currencies = ["руб.", "руб", "рублей", "р.", "р"]

interface TransactionSpec {
    category: ParsedCategory,
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

function categorySynonym(s: CategorySynonym<string | RegExp>) {
    if (typeof s.value === "string") return stringIgnoreCase(s.value)
    else return P.regexp(s.value).desc(s.value.source)
}

export function transactionParser(categories: Category[]) {
    return P.createLanguage<TransactionSpec>({
        category: () =>
            P.alt(
                ...categories
                    .map(c => [
                        {
                            parserLen: c.name.length,
                            parser: stringIgnoreCase(c.name)
                        },
                        ...c.synonyms.map(s => ({
                            parserLen: typeof s.value === 'string' ? s.value.length : 0,
                            parser: categorySynonym(s)
                        }))
                    ])
                    .reduce((a, b) => a.concat(b), [])
                    .sort((a, b) => b.parserLen - a.parserLen)
                    .map(p => p.parser)
            )
                .map(userText => {
                    const category = { ...categories.find(category => category.matches(userText))! } as ParsedCategory
                    if (category.name.toLowerCase() !== userText.trim().toLowerCase()) category.userText = userText
                    return category
                }),
        number: () => P.regexp(/-?(0|[1-9][0-9]*)([.,][0-9]+)?([eE][+-]?[0-9]+)?/).map(n => Number(n.replace(/,/, '.'))).desc("число"),
        currency: () =>
            P.alt(
                ...currencies
                    .sort((a, b) => b.length - a.length)
                    .map(stringIgnoreCase)).lookahead(P.alt(P.whitespace, P.end).desc("пробел или конец строки")),
        amountOfMoney: (l) => l.number.skip(P.optWhitespace.then(l.currency).fallback(null)),
        amountOfMoneyExpr: (l) => P.seqMap(
            l.amountOfMoney,
            P.regexp(/[+-]/).trim(P.optWhitespace),
            l.amountOfMoneyExpr,
            (a, op, b) => op === "+" ? a + b : a - b).or(l.amountOfMoney),
        comment: () => P.any.atLeast(1).tie().desc("комментарий"),
        date: () =>
            P.alt(
                stringIgnoreCase("вчера").map(() => shiftCurrentDate(-1)),
                stringIgnoreCase("позавчера").map(() => shiftCurrentDate(-2)),
                P.digits
                    .skip(P.optWhitespace.then(P.regexp(/дн(я|ей)\s+назад/i)))
                    .desc("дата, например '5 дней назад'").map((n) => shiftCurrentDate(-Number.parseInt(n)))),

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

export function shiftCurrentDate(daysToShift: number) {
    const currentDate = new Date()
    currentDate.setDate(currentDate.getDate() + daysToShift)
    return currentDate
}