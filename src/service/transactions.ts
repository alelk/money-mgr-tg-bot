import { AbstractGoogleSpreadsheetService } from './index'
import { Transaction } from '../model'

export class TransactionsService extends AbstractGoogleSpreadsheetService {

    constructor(sheetId: string, authEmail: string, authKey: string) {
        super(sheetId, authEmail, authKey)
    }

    async addTransaction(t: Transaction) {
        const d = await this.doc
        const sheet = d.sheetsByTitle["transactions"]
        await sheet.addRow({
            date: t.date.toDateString(),
            user: t.user,
            type: t.type.name,
            category: t.category.name,
            amount: t.amountOfMoney,
            comment: t.comment || ""
        })
    }
}