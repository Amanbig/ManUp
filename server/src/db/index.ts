import config from "../config/config.js"
import { pg_db } from "./type/postgres.js"
import { pglite_db } from "./type/pglite.js"

export const db = ()=>{
    if (config.DB_TYPE == "PGLITE"){
        return pglite_db
    }
    else if (config.DB_TYPE == "POSTGRES"){
        return pg_db
    }
}