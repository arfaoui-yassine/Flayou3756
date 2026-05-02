import mysql from 'mysql2/promise';
export type DbPool = mysql.Pool;
/** DATABASE_URL ex. mysql://user:password@127.0.0.1:3306/datasouk */
export declare function createPool(databaseUrl: string): DbPool;
export declare function migrate(pool: DbPool): Promise<void>;
//# sourceMappingURL=index.d.ts.map