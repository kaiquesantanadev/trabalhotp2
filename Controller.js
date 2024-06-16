const Prato = require('../models/Prato');
const Ingrediente = require('../models/Ingrediente');
const PratoXIngrediente = require('../models/PratoXIngrediente');
const imageController = require('./image');
const tipos = ['Menu principal', 'Sobremesas', 'Bebidas não alcoólicas', 'Menu Kids'];
const medidas = ['Gramas', 'Colher de chá', 'Unidade', 'Fatia', 'Ml'];

const SimpleDuplicateCheckStrategy = require('./SimpleDuplicateCheckStrategy');
const duplicateCheckStrategy = new SimpleDuplicateCheckStrategy();

const create = async (req, res) => {
    let pageTitle = 'Cadastrar prato';
    let jsScripts = ['prato.js'];
    let cssStyles = ['prato.css'];
    let ingredientes = await Ingrediente.findAll();

    return res.render('prato', { pageTitle, cssStyles, jsScripts, Imagem: null, tipos, medidas, ingredientes });
};

const add = async (req, res) => {
    try {
        let { nome, descricao, tipo, preco, ingredientes, newIng, porcoes, medidas } = req.body;
        let error;

        if (ingredientes == null) ingredientes = [];

        let prato = {
            Nome: nome,
            Descricao: descricao,
            Tipo: tipo,
            Preco: preco
        };

        if (newIng) {
            for (const nome of newIng) {
                let newIngredient = { Nome: nome };

                await Ingrediente.create(newIngredient)
                    .then((ingrediente) => {
                        newIngredient = ingrediente;
                    })
                    .catch((err) => {
                        error = 'Ingrediente já cadastrado!!';
                    });

                if (error) break;

                ingredientes.push(newIngredient.ID);
            }
        }

        if (error != null) {
            req.error = error;
            return get(req, res);
        }

        const recipe = ingredientes.map((ID_Ingrediente, index) => ({
            ID_Ingrediente,
            Porcao: porcoes[index],
            Tipo_Porcao: medidas[index],
        }));

        let hasDuplicate = duplicateCheckStrategy.checkDuplicates(recipe);

        if (hasDuplicate) error = 'Ingredientes inválidos!';

        if (req?.file?.filename) prato['ID_Img'] = await imageController.add("Pratos", req.file.filename);

        if (error != null) {
            req.error = error;
            return get(req, res);
        }

        await Prato.create(prato)
            .then((newPlate) => {
                prato = newPlate;
            })
            .catch((err) => {
                return res.status(404).send(err.stack);
            });

        recipe.forEach(async function (element) {
            let pratoXingrediente = {
                ID_Prato: prato.ID,
                ID_Ingrediente: element.ID_Ingrediente,
                Porcao: element.Porcao,
                Tipo_Porcao: element.Tipo_Porcao
            };

            await PratoXIngrediente.create(pratoXingrediente);
        });

        return res.redirect('http://localhost:3000/pratos/');
    } catch (error) {
        return res.status(404).send(error.stack);
    }
};

const get = async (req, res) => {
    try {
        let prato = await Prato.findByPk(req.params.id);

        if (prato == null) return res.redirect('http://localhost:3000/pratos');

        let pageTitle = 'Editar prato';
        let jsScripts = ['prato.js'];
        let cssStyles = ['prato.css'];
        let ingredientes = await Ingrediente.findAll();
        let Imagem;

        if (typeof prato?.ID_Img != 'undefined') Imagem = await imageController.get(prato.ID_Img);

        let receita = await PratoXIngrediente.findAll({ where: { ID_Prato: prato.ID } });

        return res.render('prato', { pageTitle, cssStyles, jsScripts, error: req?.error, tipos, medidas, ingredientes, prato, receita, Imagem });
    } catch (error) {
        return res.status(404).send(error.stack);
    }
};

const getAll = async (req, res) => {
    try {
        let pratos = await Prato.findAll();

        return res.render('main', { pratos });
    } catch (error) {
        return res.status(404).send(error.stack);
    }
};

const update = async (req, res) => {
    try {
        let { nome, descricao, tipo, preco, ingredientes, newIng, porcoes, medidas } = req.body;
        let error;

        if (ingredientes == null) ingredientes = [];

        let prato = {
            Nome: nome,
            Descricao: descricao,
            Tipo: tipo,
            Preco: preco
        };

        if (newIng) {
            for (const nome of newIng) {
                let newIngredient = { Nome: nome };

                await Ingrediente.create(newIngredient)
                    .then((ingrediente) => {
                        newIngredient = ingrediente;
                    })
                    .catch((err) => {
                        error = 'Ingrediente já cadastrado!!';
                    });

                if (error) break;

                ingredientes.push(newIngredient.ID);
            }
        }

        if (error != null) {
            req.error = error;
            return get(req, res);
        }

        const recipe = ingredientes.map((ID_Ingrediente, index) => ({
            ID_Ingrediente,
            Porcao: porcoes[index],
            Tipo_Porcao: medidas[index],
        }));

        let hasDuplicate = duplicateCheckStrategy.checkDuplicates(recipe);

        if (hasDuplicate) error = 'Ingredientes inválidos!';

        if (req?.file?.filename) {
            let oldImg = await Prato.findOne({ where: { ID: req.params.id } });

            prato['ID_Img'] = await imageController.update(oldImg.ID_Img, "Pratos", req.file.filename);
        }

        if (error != null) {
            req.error = error;
            return get(req, res);
        }

        await Prato.update(prato, { where: { ID: req.params.id } });
        await PratoXIngrediente.destroy({ where: { ID_Prato: req.params.id } });

        recipe.forEach(async function (element) {
            let pratoXingrediente = {
                ID_Prato: req.params.id,
                ID_Ingrediente: element.ID_Ingrediente,
                Porcao: element.Porcao,
                Tipo_Porcao: element.Tipo_Porcao
            };

            await PratoXIngrediente.create(pratoXingrediente);
        });

        return res.redirect('http://localhost:3000/pratos/');
    } catch (error) {
        return res.status(404).send(error.stack);
    }
};

const remove = async (req, res) => {
    try {
        await Prato.destroy({ where: { ID: req.params.id } });

        return res.redirect('http://localhost:3000/pratos/');
    } catch (error) {
        return res.status(400).send(error.stack);
    }
};

module.exports = {
    create,
    add,
    get,
    getAll,
    update,
    remove
};