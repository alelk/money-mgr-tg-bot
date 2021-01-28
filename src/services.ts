import { assert } from 'console'
import { TransactionTypesService } from './service/transactionTypes'
import { CategoriesService } from './service/categories'
import { TransactionsService } from './service/transactions'

const moneyMgrEmail = process.env["MONEY_MGR_EMAIL"]
const moneyMgrKey = process.env["MONEY_MGR_KEY"]
assert(moneyMgrEmail != null, "No MONEY_MGR_EMAIL environment variable found")
assert(moneyMgrKey != null, "No MONEY_MGR_KEY environment variable found")

export const categoriesSvc =
    new CategoriesService("1qPm39FBUKRPVrk2jl3e8smeSb-yggdTo9IlCx7ff1Hc", moneyMgrEmail!, moneyMgrKey!.replace(/\\n/g, '\n'))
export const transactionTypesSvc =
    new TransactionTypesService("1qPm39FBUKRPVrk2jl3e8smeSb-yggdTo9IlCx7ff1Hc", moneyMgrEmail!, moneyMgrKey!.replace(/\\n/g, '\n'))
export const transactionsSvc =
    new TransactionsService("1qPm39FBUKRPVrk2jl3e8smeSb-yggdTo9IlCx7ff1Hc", moneyMgrEmail!, moneyMgrKey!.replace(/\\n/g, '\n'))