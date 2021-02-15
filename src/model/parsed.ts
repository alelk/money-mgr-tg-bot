import { Category } from "."

export class ParsedCategory extends Category {
    userText?: string
}

export class ParsedTransaction {
    category: ParsedCategory
    amountOfMoney: number
    comment?: string
    date?: Date

    constructor(category: ParsedCategory, amountOfMoney: number, comment?: string, date?: Date) {
        this.category = category
        this.amountOfMoney = amountOfMoney
        this.comment = comment
        this.date = date
    }
}