const Database = require('./Database');
const Prato = require('../models/Prato');
const PratoXIngrediente = require('../models/PratoXIngrediente');
const imageController = require('../controllers/image'); 
const SimpleDuplicateCheckStrategy = require('../SimpleDuplicateCheckStrategy');
const Ingrediente = require('../models/Ingrediente');

class PratoDatabase extends Database {
    constructor() {
        super(Prato);
        this.duplicateCheckStrategy = new SimpleDuplicateCheckStrategy();
    }

    async get(id) {
        return await this.model.findByPk(id);
    }

    async getAll() {
        return await this.model.findAll();
    }

    async create(data) {
        const prato = await this.model.create(data);
        return prato;
    }

    async update(id, data) {
        await this.model.update(data, { where: { ID: id } });
    }

    async remove(id) {
        await PratoXIngrediente.destroy({ where: { ID_Prato: id } });
        await this.model.destroy({ where: { ID: id } });
    }

    async getAllIngredients() {
        return await Ingrediente.findAll();
    }

    async createIngredient(data) {
        return await Ingrediente.create(data);
    }

    async createPratoXIngrediente(data) {
        return await PratoXIngrediente.create(data);
    }
}

module.exports = PratoDatabase;