import P from 'parsimmon'
import { StatisticRequest } from "../model/statistic";

interface StatisticRequestSpec {
    date: Date
    statisticRequest: StatisticRequest
}

export const statisticRequestParser = P.createLanguage<StatisticRequestSpec>({
    date: () => P.alt(
        P.regexp(/(этот|текущий|последний\s+)?месяц/i).map(() => new Date()),
        P.regexp(/прошлый\s+месяц/i).map(() => shiftCurrentMonth(-1)),
        P.regexp(/позапрошлый\s+месяц/i).map(() => shiftCurrentMonth(-2)),
        P.digits
            .skip(P.optWhitespace.then(P.regexp(/месяц(а|ев)?\s+назад/i)))
            .desc("сколько месяцев назад, например '3 месяца назад'").map((n) => shiftCurrentMonth(-Number.parseInt(n)))
    ),
    statisticRequest: l => P.regexp(/\s*статистика(\s+за)?/).then(P.optWhitespace).then(l.date.fallback(new Date())).map(date => new StatisticRequest(date))
})

export function shiftCurrentMonth(monthsToShift: number) {
    const d = new Date()
    d.setMonth(d.getMonth() + monthsToShift)
    return d
}