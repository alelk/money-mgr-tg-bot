export class Transaction {
    date: Date
    user: string
    type: TransactionType
    category: Category
    amountOfMoney: number
    comment?: string

    constructor(date: Date, user: string, type: TransactionType, category: Category, amountOfMoney: number, comment?: string) {
        this.date = date
        this.user = user
        this.type = type
        this.category = category
        this.amountOfMoney = amountOfMoney
        this.comment = comment
    }
}

export class TransactionType {
    name: string
    comment?: string

    constructor(name: string, comment?: string) {
        this.name = name
        this.comment = comment
    }
}

export class Category {
    transactionTypeName: string
    name: string
    parentCategoryName?: string
    synonyms: string[]
    comment?: string

    constructor(transactionTypeName: string, name: string, synonyms: string[], parentCategoryName?: string, comment?: string) {
        this.transactionTypeName = transactionTypeName
        this.name = name
        this.parentCategoryName = parentCategoryName
        this.synonyms = synonyms
        this.comment = comment
    }

}