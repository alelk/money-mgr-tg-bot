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

export interface CategorySynonym<V> {
    value: V

    matches(s: string): boolean
}

class CategorySynonymString implements CategorySynonym<string> {
    value: string
    constructor(value: string) {
        this.value = value
    }
    matches(s: string): boolean {
        return this.value.toLowerCase() === s.toLowerCase()
    }
}

class CategorySynonymRegExp implements CategorySynonym<RegExp> {
    value: RegExp
    constructor(value: RegExp) {
        this.value = value
    }
    matches(s: string): boolean {
        return this.value.test(s)
    }
}


export function parseCategorySynonym(s: string): CategorySynonymString | CategorySynonymRegExp {
    const r = /\/(.+)\//.exec(s)?.[1]
    if (r != null) return new CategorySynonymRegExp(RegExp(r, "i"))
    else return new CategorySynonymString(s)
}


export class Category {
    transactionTypeName: string
    name: string
    parentCategoryName?: string
    synonyms: CategorySynonym<string | RegExp>[]
    comment?: string

    constructor(transactionTypeName: string, name: string, synonyms: CategorySynonym<string | RegExp>[], parentCategoryName?: string, comment?: string) {
        this.transactionTypeName = transactionTypeName
        this.name = name
        this.parentCategoryName = parentCategoryName
        this.synonyms = synonyms
        this.comment = comment
    }

    matches(s: string): boolean {
        return this.name.toLowerCase() === s.toLocaleLowerCase() || (this.synonyms.find(synonym => synonym.matches(s)) != null)
    }

}