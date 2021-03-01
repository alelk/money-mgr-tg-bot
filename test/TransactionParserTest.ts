import { transactionParser, shiftCurrentDate } from '../src/parser/transactions'
import { deepStrictEqual, strictEqual } from 'assert'
import { ParsedCategory, ParsedTransaction } from '../src/model/parsed'
import { Category, parseCategorySynonym } from '../src/model'

const cat = (transactionType: string, name: string, synonyms: string[]) => new Category(transactionType, name, synonyms.map(parseCategorySynonym))

const testCategories = [
    cat("расходы", "продукты", ["еда"]),
    cat("расходы", "автомобиль", ["/(бенз(ин)?|запчасти)/"]),
    cat("доходы", "зарплата", []),
    cat("доходы", "кэшбек", ["бонусы", "бонусы tinkoff банк", "бонусы tinkoff"])]

const categoryByName = (name: string) => testCategories.find(c => c.name === name)!

describe("transaction parser", () => {
    it("can parse categories", () => {
        deepStrictEqual(transactionParser(testCategories).category.tryParse("Продукты"), { ...categoryByName('продукты') })
        deepStrictEqual(transactionParser(testCategories).category.tryParse("зарплата"), { ...categoryByName('зарплата') })
    })
    it("can parse categories by synonyms", () => {
        const cat1 = transactionParser(testCategories).category.tryParse("еда")
        strictEqual(cat1.name, "продукты")
        strictEqual(cat1.userText, "еда")
        const cat2 = transactionParser(testCategories).category.tryParse("бензин")
        strictEqual(cat2.name, "автомобиль")
        strictEqual(cat2.userText, "бензин")
        const cat3 = transactionParser(testCategories).category.tryParse("бенз")
        strictEqual(cat3.name, "автомобиль")
        strictEqual(cat3.userText, "бенз")
    })
    it("can parse categories by RegExp synonyms", () => {
        deepStrictEqual(transactionParser(testCategories).category.tryParse("бензин"), { ...categoryByName('автомобиль'), userText: 'бензин' })
        deepStrictEqual(transactionParser(testCategories).category.tryParse("бенз"), { ...categoryByName('автомобиль'), userText: 'бенз' })
    })
    it("can parse amount of money", () => {
        deepStrictEqual(transactionParser([]).amountOfMoney.parse("1234"), { status: true, value: 1234 })
        deepStrictEqual(transactionParser([]).amountOfMoney.parse("1234.234"), { status: true, value: 1234.234 })
        deepStrictEqual(transactionParser([]).amountOfMoney.parse("1234,234"), { status: true, value: 1234.234 })
        deepStrictEqual(transactionParser([]).amountOfMoney.parse("1234,234 Рублей"), { status: true, value: 1234.234 })
    })
    it("can parse date", () => {
        const d1 = transactionParser([]).date.tryParse("Вчера")
        strictEqual(d1.getDate(), shiftCurrentDate(-1).getDate())
        const d2 = transactionParser([]).date.tryParse("позавчера")
        strictEqual(d2.getDate(), shiftCurrentDate(-2).getDate())
        const d3 = transactionParser([]).date.tryParse("3 Дня назад")
        strictEqual(d3.getDate(), shiftCurrentDate(-3).getDate())
        const d4 = transactionParser([]).date.tryParse("33 Дня назад")
        strictEqual(d4.getDate(), shiftCurrentDate(-33).getDate())
    })
    it("can parse transaction", () => {
        const transaction1 = transactionParser(testCategories).transaction.tryParse("еда    123.234")
        deepStrictEqual(transaction1.category, { ...categoryByName("продукты"), userText: 'еда' })
        strictEqual(transaction1.amountOfMoney, 123.234)
        const transaction2 = transactionParser(testCategories).transaction.tryParse("123.234 руБ. зарплата")
        deepStrictEqual(transaction2.category, { ...categoryByName("зарплата") })
        strictEqual(transaction2.amountOfMoney, 123.234)
    })
    it("can parse categories in transaction by longest string expression", () => {
        const t1 = transactionParser(testCategories).transaction.tryParse("бонусы 100 р")
        deepStrictEqual(t1.category, { ...categoryByName('кэшбек'), userText: "бонусы" })
        const t2 = transactionParser(testCategories).transaction.tryParse("бонусы tinkoff 500")
        deepStrictEqual(t2.category, { ...categoryByName('кэшбек'), userText: "бонусы tinkoff" })
        const t3 = transactionParser(testCategories).transaction.tryParse("бонусы tinkoff банк 500")
        deepStrictEqual(t3.category, { ...categoryByName('кэшбек'), userText: "бонусы tinkoff банк" })
    })
    it("can parse transaction with comment", () => {
        const t1 = transactionParser(testCategories).transaction.tryParse("продукты    123.234    рублей   макароны, мясо")
        strictEqual(t1.comment, "макароны, мясо")
        const t2 = transactionParser(testCategories).transaction.tryParse("123.234руб зарплата на мою карту")
        strictEqual(t2.comment, 'на мою карту')
    })
    it("can parse transaction with comment and date", () => {
        const t1 = transactionParser(testCategories).transaction.tryParse("вчера продукты    123.234    рублей   Макароны, Мясо")
        strictEqual(t1.date?.getDate(), shiftCurrentDate(-1).getDate())
        deepStrictEqual(t1.category, {...categoryByName("продукты")})
        strictEqual(t1.amountOfMoney, 123.234)
        strictEqual(t1.comment, "Макароны, Мясо")
    })
    it("can parse transaction with arithmetic expression", () => {
        const t1 = transactionParser(testCategories).transaction.tryParse("продукты  123 р + 345 руб. + 3 -23    рублей   макароны, мясо")
        strictEqual(t1.category.name, 'продукты')
        strictEqual(t1.amountOfMoney, 123 + 345 + 3 - 23)
        strictEqual(t1.comment, 'макароны, мясо')
        const t2 = transactionParser(testCategories).transaction.tryParse("123+345+3-23 автомобиль запчасти")
        strictEqual(t2.category.name, 'автомобиль')
        strictEqual(t2.amountOfMoney, 123 + 345 + 3 - 23)
        strictEqual(t2.comment, 'запчасти')
    })
})