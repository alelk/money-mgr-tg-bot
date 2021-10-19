import { AbstractGoogleSpreadsheetService } from "."
import { Category, parseCategorySynonym } from "../model"

export class CategoriesService extends AbstractGoogleSpreadsheetService {

    constructor(sheetId: string, authEmail: string, authKey: string) {
        super(sheetId, authEmail, authKey)
    }

    async getCategories(): Promise<Category[]> {
        const d = await this.doc
        const sheet = d.sheetsByTitle["categories"]
        const rows = await sheet.getRows()
        return rows.map(r =>
            new Category(
                r["transactionType"],
                r["name"],
                (<string>r["synonyms"])?.split("\n").map(parseCategorySynonym) || [],
                r["parent"]))
    }

}