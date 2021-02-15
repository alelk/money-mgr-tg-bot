import { AbstractGoogleSpreadsheetService } from "."

export class StatisticService extends AbstractGoogleSpreadsheetService {

    constructor(sheetId: string, authEmail: string, authKey: string) {
        super(sheetId, authEmail, authKey)
    }

    async getStatistic(): Promise<void> {
        const d = await this.doc
        const sheet = d.sheetsByTitle["month report by category"]
        const rows = await sheet.getRows()
        console.log("row", rows[1])
        console.log("category", rows[1]["category"])
        console.log("category", rows[1]["SUM of amount"])
        console.log("a1Range", rows[1].a1Range)
    }

}