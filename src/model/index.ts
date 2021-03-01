export enum TransactionDirection {
    INCOME = 'income',
    OUTCOME = 'outcome',
    NEUTRAL = 'neutral'
}

export class TransactionType {
    name: string
    direction: TransactionDirection
    comment?: string

    constructor(name: string, direction: TransactionDirection, comment?: string) {
        this.name = name
        this.direction = direction
        this.comment = comment
    }
}

export class Transaction {
    id: number
    date: Date
    user: string
    type: TransactionType
    category: Category
    amountOfMoney: number
    comment?: string

    constructor(id: number, date: Date, user: string, type: TransactionType, category: Category, amountOfMoney: number, comment?: string) {
        this.id = id
        this.date = date
        this.user = user
        this.type = type
        this.category = category
        this.amountOfMoney = amountOfMoney
        this.comment = comment
    }
}

export interface EditedTransaction {
    id: number
    date?: Date
    user?: string
    type?: TransactionType
    category?: Category
    amountOfMoney?: number
    comment?: string
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

export enum CategoryRelationToParent {
    POSITIVE = "positive",
    NEGATIVE = "negative"
}

export class Category {
    transactionTypeName: string
    name: string
    parentCategoryName?: string
    relationToParent: CategoryRelationToParent
    synonyms: CategorySynonym<string | RegExp>[]
    comment?: string

    constructor(
        transactionTypeName: string,
        name: string,
        synonyms: CategorySynonym<string | RegExp>[],
        relationToParent: CategoryRelationToParent = CategoryRelationToParent.POSITIVE,
        parentCategoryName?: string,
        comment?: string
    ) {
        this.transactionTypeName = transactionTypeName
        this.name = name
        this.relationToParent = relationToParent
        this.parentCategoryName = parentCategoryName
        this.synonyms = synonyms
        this.comment = comment
    }

    matches(s: string): boolean {
        return this.name.toLowerCase() === s.toLocaleLowerCase() || (this.synonyms.find(synonym => synonym.matches(s)) != null)
    }

}