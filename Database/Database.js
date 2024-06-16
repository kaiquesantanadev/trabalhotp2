class Database {
    constructor(model) {
        this.model = model;
    }

    async get(id) {
        throw new Error('Method not implemented');
    }

    async getAll() {
        throw new Error('Method not implemented');
    }

    async create(data) {
        throw new Error('Method not implemented');
    }

    async update(id, data) {
        throw new Error('Method not implemented');
    }

    async remove(id) {
        throw new Error('Method not implemented');
    }
}

module.exports = Database;