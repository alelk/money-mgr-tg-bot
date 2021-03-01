import P from 'parsimmon'
import { StatisticRequest } from "../model/statistic";

interface StatisticRequestSpec {
    date: Date
    statisticRequest: StatisticRequest
}


export const statisticRequestParser = P.createLanguage<StatisticRequestSpec>({
    date: () => P.alt(
        P.regexp(/прошлый\s+месяц/i).map(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d }),
        P.regexp(/позапрошлый\s+месяц/i).map(() => { const d = new Date(); d.setMonth(d.getMonth() - 2); return d }),
        P.regexp(/позапрошлый\s+месяц/i).map(() => { const d = new Date(); d.setMonth(d.getMonth() - 2); return d }),
        P.digits
            .skip(P.optWhitespace.then(P.regexp(/месяц(ев)?\s+назад/i)))
            .desc("сколько месяцев назад, например '2 месяца назад'").map((n) => {
                const d = new Date(); d.setMonth(d.getMonth() - Number.parseInt(n)); return d
            })
    ),
    statisticRequest: l => P.regexp(/\s*статистика(\s+за)?/).then(l.date.fallback(new Date())).map(date => new StatisticRequest(date))
})