import { Category, TransactionType } from "."

export class StatisticRequest {
    date: Date
    constructor(date: Date) {
        this.date = date
    }
}

export class CategoryStatistic {
    category: Category
    amount: number
    children?: CategoryStatistic[]
    constructor(category: Category, amount: number, children?: CategoryStatistic[]) {
        this.category = category
        this.amount = amount
        this.children = children
    }
}

export class TransactionTypeStatistic {
    transactionType: TransactionType
    amount: number
    categories: CategoryStatistic[]
    constructor(transactionType: TransactionType, amount: number, categories: CategoryStatistic[]) {
        this.transactionType = transactionType
        this.amount = amount
        this.categories = categories
    }
}

export class MonthStatustic {
    date: Date
    transactionTypeStatistic: TransactionTypeStatistic[]
    result: string

    constructor(date: Date, transactionTypeStatistic: TransactionTypeStatistic[], result: string) {
        this.date = date
        this.transactionTypeStatistic = transactionTypeStatistic,
            this.result = result
    }
}