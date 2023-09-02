import { AbstractGoogleSpreadsheetService } from './index'
import { EditedTransaction, Transaction } from '../model'

export class TransactionsService extends AbstractGoogleSpreadsheetService {

    private lastTransactionRow?: number

    constructor(sheetId: string, authEmail: string, authKey: string) {
        super(sheetId, authEmail, authKey)
    }

    private async getSheet() {
        const d = await this.doc
        return d.sheetsByTitle["transactions"]
    }

    async addTransaction(t: Transaction) {
        const sheet = await this.getSheet()
        const row = await sheet.addRow({
            id: t.id,
            date: t.date.toDateString(),
            user: t.user,
            type: t.type.name,
            category: t.category.name,
            amount: t.amountOfMoney,
            comment: t.comment || ""
        })
        this.lastTransactionRow = row.rowNumber
    }

    async editTransaction(editedTransaction: EditedTransaction) {
        const sheet = await this.getSheet()
        const rows = (this.lastTransactionRow == null || this.lastTransactionRow - 1000 < 0)
            ? await sheet.getRows()
            : await sheet.getRows({ limit: 1000, offset: this.lastTransactionRow - 1000 })
        const row = rows.find(r => r.get("id").toString() === editedTransaction.id.toString())
        if (row == null) throw Error(`Не найдена финансовая транзакция с id ${editedTransaction.id}`)
        if (editedTransaction.date != null) row.set("date", editedTransaction.date.toDateString())
        if (editedTransaction.user != null) row.set("user", editedTransaction.user)
        if (editedTransaction.type != null) row.set("type", editedTransaction.type.name)
        if (editedTransaction.category != null) row.set("category", editedTransaction.category.name)
        if (editedTransaction.amountOfMoney != null) row.set("amount", editedTransaction.amountOfMoney)
        if (editedTransaction.comment != null) row.set("comment", editedTransaction.comment)
        await row.save()
    }
}