const { Genre } = require('../../../dbObjects');
const Discord = require('discord.js');

module.exports = {
	name: 'genre',
	description: 'Create, edit, remove and show genre',
	options: [
		{
			name: 'add',
			type: 'SUB_COMMAND',
			description: 'Add a movie genre',
			options: [
				{
					name: 'genrename',
					type: 'STRING',
					description: 'Name of the genre',
					required: true,
				},
				{
					name: 'color',
					type: 'STRING',
					description: 'Give the genre a color',
					required: true,
				},
			],
		}, {
			name: 'delete',
			type: 'SUB_COMMAND',
			description: 'Delete a genre',
			options: [
				{
					name: 'genrename',
					type: 'STRING',
					description: 'Name of the genre',
					required: true,
				},
			],
		}, {
			name: 'edit',
			type: 'SUB_COMMAND',
			description: 'Edit a genre',
			options: [
				{
					name: 'genrename',
					type: 'STRING',
					description: 'Name of the genre',
					required: true,
				},
				{
					name: 'color',
					type: 'STRING',
					description: 'Give the genre a color',
					required: true,
				},
			],
		}, {
			name: 'show',
			type: 'SUB_COMMAND',
			description: 'Show all genres',
		},
	],
	defaultPermission: true,
	// channelWhitelist: ['789139711829737522', '791703686912016405'],
	// roles: ['766633420713230336', '599906769589764097'],
	// + Admins
	permissions: [
		{
			id: '766633420713230336',
			type: 'ROLE',
			permission: true,
		},
		{
			id: '599906769589764097',
			type: 'ROLE',
			permission: true,
		},
	],
	disable: async function(interaction) {
		await Genre.destroy({ where: { guild_id: interaction.guild.id } });
		const globalCommands = await interaction.guild.commands.fetch();
		const command = globalCommands.find(cmd => cmd.name === this.name);

		await interaction.client.guilds.cache.get(interaction.guild.id).commands.delete(command.id);
	},
	enable: async function(interaction) {
		await interaction.client.guilds.cache.get(interaction.guild.id).commands.create(
			{
				name: this.name,
				description: this.description,
				options: this.options,
				defaultPermission: this.defaultPermission,
			},
		);
	},
	execute: async function(interaction) {
		if (interaction.options.first().name === 'add') {
			const genreName = interaction.options.first().options.get('genrename').value;
			const genreColor = interaction.options.first().options.get('color').value;

			try {
				const movie = await Genre.create({
					name: genreName,
					color: genreColor,
					guild_id: interaction.guild.id,
				});
				return await interaction.reply({ content: `Gerne ${movie.name} wurde hinzugefügt.`, ephemeral: true });
			}
			catch (e) {
				if (e.name === 'SequelizeUniqueConstraintError') {
					return await interaction.reply({ content: 'Der Gerne oder Farbe existiert bereits.', ephemeral: true });
				}
				return await interaction.reply({ content: 'Es gabe beim hinzufügen einen Fehler.', ephemeral: true });
			}
		}
		else if (interaction.options.first().name === 'edit') {
			const genreName = interaction.options.first().options.get('genrename').value;
			const genreColor = interaction.options.first().options.get('color').value;

			// equivalent to: UPDATE tags (descrption) values (?) WHERE name = ?;
			const affectedRows = await Genre.update({ color: genreColor }, { where: { name: genreName, guild_id: interaction.guild.id } });
			if (affectedRows > 0) {
				return await interaction.reply({ content: `Genre ${genreName} was edited.`, ephemeral: true });
			}
			return await interaction.reply({ content: `Could not find a movie with name ${genreName}.`, ephemeral: true });
		}
		else if (interaction.options.first().name === 'delete') {
			const genreName = interaction.options.first().options.get('genrename').value;

			const rowCount = await Genre.destroy({ where: { name: genreName, guild_id: interaction.guild.id } });
			if (!rowCount) return await interaction.reply({ content: 'That genre did not exist.', ephemeral: true });

			return await interaction.reply({ content: 'Genre deleted.', ephemeral: true });
		}
		else if (interaction.options.first().name === 'show') {
			const genres = await Genre.findAll({ where: { guild_id: interaction.guild.id } });

			if (!genres.length) return await interaction.reply({ content: 'Es gibt keine Genres.', ephemeral: true });

			let genreField = '';

			genres.forEach(child => {
				genreField = genreField + child.name + '\n';
			});

			const embed = new Discord.MessageEmbed()
				.setTitle('Genres')
				.setColor('YELLOW')
				.addFields(
					{ name: 'Name', value: genreField, inline: true },
				);
			return await interaction.reply({ content: '', ephemeral: true, embeds: [embed] });
		}
	},

};