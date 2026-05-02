export async function createDB(config) {
    if (config.db_type === 'mssql') {
        const { MssqlDB } = await import('./mssql.js');
        return new MssqlDB(config.mssql);
    }
    const { SqliteDB } = await import('./sqlite.js');
    return new SqliteDB(config.sqlite.file_path);
}
//# sourceMappingURL=index.js.map