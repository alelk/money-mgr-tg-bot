import { AbstractGoogleSpreadsheetService } from ".";
import { TransactionType } from "../model";

export class TransactionTypesService extends AbstractGoogleSpreadsheetService {

    constructor(sheetId: string, authEmail: string, authKey: string) {
        super(sheetId, authEmail, authKey)
    }

    async getTransactionTypes(): Promise<TransactionType[]> {
        const d = await this.doc
        const sheet = d.sheetsByTitle["transaction types"]
        const rows = await sheet.getRows()
        return rows.map(r => new TransactionType(r["name"], r["direction"], r["comment"]))
    }

}