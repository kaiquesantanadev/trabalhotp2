const PratoDatabase = require('../database/PratoDatabase');
const pratoDatabase = new PratoDatabase();
const tipos = ['Menu principal', 'Sobremesas', 'Bebidas não alcoólicas', 'Menu Kids'];
const medidas = ['Gramas', 'Colher de chá', 'Unidade', 'Fatia', 'Ml'];
const imageController = require('./image'); 
const SimpleDuplicateCheckStrategy = require('../SimpleDuplicateCheckStrategy');
const duplicateCheckStrategy = new SimpleDuplicateCheckStrategy();


class PratoController {
    async create(req, res) {
        let pageTitle = 'Cadastrar prato';
        let jsScripts = ['prato.js'];
        let cssStyles = ['prato.css'];
        let ingredientes = await pratoDatabase.getAllIngredients();

        return res.render('prato', { pageTitle, cssStyles, jsScripts, Imagem: null, tipos, medidas, ingredientes });
    }

    async add(req, res) {
        try {
            let { nome, descricao, tipo, preco, ingredientes, newIng, porcoes, medidas } = req.body;
            let error;

            if (ingredientes == null) ingredientes = [];

            let pratoData = {
                Nome: nome,
                Descricao: descricao,
                Tipo: tipo,
                Preco: preco
            };

            if (newIng) {
                for (const nome of newIng) {
                    let newIngredient = { Nome: nome };

                    await pratoDatabase.createIngredient(newIngredient)
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
                return this.get(req, res);
            }

            const recipe = ingredientes.map((ID_Ingrediente, index) => ({
                ID_Ingrediente,
                Porcao: porcoes[index],
                Tipo_Porcao: medidas[index],
            }));

            let hasDuplicate = duplicateCheckStrategy.checkDuplicates(recipe);

            if (hasDuplicate) error = 'Ingredientes inválidos!';

            if (req?.file?.filename) pratoData['ID_Img'] = await imageController.add("Pratos", req.file.filename);

            if (error != null) {
                req.error = error;
                return this.get(req, res);
            }

            await pratoDatabase.create(pratoData);

            recipe.forEach(async function (element) {
                let pratoXingrediente = {
                    ID_Prato: pratoData.ID,
                    ID_Ingrediente: element.ID_Ingrediente,
                    Porcao: element.Porcao,
                    Tipo_Porcao: element.Tipo_Porcao
                };

                await pratoDatabase.createPratoXIngrediente(pratoXingrediente);
            });

            return res.redirect('http://localhost:3000/pratos/');
        } catch (error) {
            return res.status(404).send(error.stack);
        }
    }

    async get(req, res) {
        try {
            let prato = await pratoDatabase.get(req.params.id);

            if (prato == null) return res.redirect('http://localhost:3000/pratos');

            let pageTitle = 'Editar prato';
            let jsScripts = ['prato.js'];
            let cssStyles = ['prato.css'];
            let ingredientes = await pratoDatabase.getAllIngredients();
            let Imagem;

            if (typeof prato?.ID_Img != 'undefined') Imagem = await imageController.get(prato.ID_Img);

            let receita = await pratoDatabase.getPratoXIngredientes(prato.ID);

            return res.render('prato', { pageTitle, cssStyles, jsScripts, error: req?.error, tipos, medidas, ingredientes, prato, receita, Imagem });
        } catch (error) {
            return res.status(404).send(error.stack);
        }
    }

    async getAll(req, res) {
        try {
            let pratos = await pratoDatabase.getAll();

            return res.render('main', { pratos });
        } catch (error) {
            return res.status(404).send(error.stack);
        }
    }

    async update(req, res) {
        try {
            let { nome, descricao, tipo, preco, ingredientes, newIng, porcoes, medidas } = req.body;
            let error;

            if (ingredientes == null) ingredientes = [];

            let pratoData = {
                Nome: nome,
                Descricao: descricao,
                Tipo: tipo,
                Preco: preco
            };

            if (newIng) {
                for (const nome of newIng) {
                    let newIngredient = { Nome: nome };

                    await pratoDatabase.createIngredient(newIngredient)
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
                return this.get(req, res);
            }

            const recipe = ingredientes.map((ID_Ingrediente, index) => ({
                ID_Ingrediente,
                Porcao: porcoes[index],
                Tipo_Porcao: medidas[index],
            }));

            let hasDuplicate = duplicateCheckStrategy.checkDuplicates(recipe);

            if (hasDuplicate) error = 'Ingredientes inválidos!';

            if (req?.file?.filename) {
                let oldImg = await pratoDatabase.get(req.params.id);
                pratoData['ID_Img'] = await imageController.update(oldImg.ID_Img, "Pratos", req.file.filename);
            }

            if (error != null) {
                req.error = error;
                return this.get(req, res);
            }

            await pratoDatabase.update(req.params.id, pratoData);
            await pratoDatabase.removePratoXIngredientes(req.params.id);

            recipe.forEach(async function (element) {
                let pratoXingrediente = {
                    ID_Prato: req.params.id,
                    ID_Ingrediente: element.ID_Ingrediente,
                    Porcao: element.Porcao,
                    Tipo_Porcao: element.Tipo_Porcao
                };

                await pratoDatabase.createPratoXIngrediente(pratoXingrediente);
            });

            return res.redirect('http://localhost:3000/pratos/');
        } catch (error) {
            return res.status(404).send(error.stack);
        }
    }

    async remove(req, res) {
        try {
            await pratoDatabase.remove(req.params.id);

            return res.redirect('http://localhost:3000/pratos/');
        } catch (error) {
            return res.status(400).send(error.stack);
        }
    }
}

module.exports = new PratoController();