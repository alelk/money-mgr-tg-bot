import { TransactionParser, Transaction } from '../src/parser/idex'
import { deepStrictEqual } from 'assert'

describe("transaction parser", () => {
    it("can parse categories", () => {
        deepStrictEqual(TransactionParser.category.parse("продукты"), { status: true, value: 'продукты' })
        deepStrictEqual(TransactionParser.category.parse("зарплата"), { status: true, value: 'зарплата' })
    })
    it("can parse amount of money", () => {
        deepStrictEqual(TransactionParser.amountOfMoney.parse("1234"), { status: true, value: 1234 })
        deepStrictEqual(TransactionParser.amountOfMoney.parse("1234.234"), { status: true, value: 1234.234 })
        deepStrictEqual(TransactionParser.amountOfMoney.parse("1234,234"), { status: true, value: 1234.234 })
        deepStrictEqual(TransactionParser.amountOfMoney.parse("1234,234 рублей"), { status: true, value: 1234.234 })
    })
    it("can parse transaction", () => {
        deepStrictEqual(
            TransactionParser.transaction.parse("продукты    123.234"),
            { status: true, value: new Transaction("продукты", 123.234)}
        )
        deepStrictEqual(
            TransactionParser.transaction.parse("123.234 руб. зарплата"),
            { status: true, value: new Transaction("зарплата", 123.234)}
        )
    })
    it("can parse transaction with comment", () => {
        deepStrictEqual(
            TransactionParser.transaction.parse("продукты    123.234    рублей   макароны, мясо"),
            { status: true, value: new Transaction("продукты", 123.234, "макароны, мясо")}
        )
        deepStrictEqual(
            TransactionParser.transaction.parse("123.234руб зарплата на мою карту"),
            { status: true, value: new Transaction("зарплата", 123.234, "на мою карту")}
        )
    })
})