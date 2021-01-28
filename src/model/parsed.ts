import { Category } from "."

export class ParsedTransaction {
    category: Category
    amountOfMoney: number
    comment?: string
    date?: Date

    constructor(category: Category, amountOfMoney: number, comment?: string, date?: Date) {
        this.category = category
        this.amountOfMoney = amountOfMoney
        this.comment = comment
        this.date = date
    }
}