import { statisticRequestParser, shiftCurrentMonth } from '../src/parser/statisticRequest'
import { deepStrictEqual, strictEqual } from 'assert'

describe("statistic request parser", () => {
    it("can parse month", () => {
        const prevM = statisticRequestParser.date.tryParse("прошлый месяц")
        console.debug("prev month: ", prevM)
        strictEqual(prevM.getMonth(), shiftCurrentMonth(-1).getMonth())
        const prev2M = statisticRequestParser.date.tryParse("позапрошлый месяц")
        console.debug("month before prev: ", prev2M)
        strictEqual(prev2M.getMonth(), shiftCurrentMonth(-2).getMonth())
        const m3 = statisticRequestParser.date.tryParse("3 месяца назад")
        console.debug("3 months ago: ", m3)
        strictEqual(m3.getMonth(), shiftCurrentMonth(-3).getMonth())
        const m13 = statisticRequestParser.date.tryParse("13 месяцев назад")
        console.debug("13 months ago: ", m13)
        strictEqual(m13.getMonth(), shiftCurrentMonth(-13).getMonth())
    })
})