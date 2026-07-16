import { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

// Configuration for self-assignable roles
export const TOGGLE_ROLES = {
  'role_beta': { name: '🧪 Beta Tester', label: 'Beta Tester', style: ButtonStyle.Primary },
  'role_creator': { name: '🎨 Creator', label: 'Creator', style: ButtonStyle.Secondary },
  'role_partner': { name: '🤝 Partner', label: 'Partner', style: ButtonStyle.Secondary },
  'role_ping_news': { name: '📢 Announcement Pings', label: 'Announcements', style: ButtonStyle.Success },
  'role_ping_updates': { name: '📋 Changelog Pings', label: 'Changelogs & Updates', style: ButtonStyle.Success }
};

export const COUNTRY_ROLES = [
  { name: '🇺🇸 United States', id: 'country_us' },
  { name: '🇸🇳 Senegal', id: 'country_sn' },
  { name: '🇨🇦 Canada', id: 'country_ca' },
  { name: '🇫🇷 France', id: 'country_fr' },
  { name: '🇬🇧 United Kingdom', id: 'country_gb' },
  { name: '🇩🇪 Germany', id: 'country_de' },
  { name: '🇯🇵 Japan', id: 'country_jp' },
  { name: '🇧🇷 Brazil', id: 'country_br' },
  { name: '🇨🇴 Colombia', id: 'country_co' },
  { name: '🇪🇬 Egypt', id: 'country_eg' },
  { name: '🇰🇪 Kenya', id: 'country_ke' },
  { name: '🇲🇦 Morocco', id: 'country_ma' },
  { name: '🇵🇱 Poland', id: 'country_pl' }
];

const DEFAULT_MEMBER_ROLE_NAME = '👤 Member';

/**
 * Handles new members joining: auto-assigns '👤 Member' role
 */
export async function handleGuildMemberAdd(member) {
  console.log(`👤 Member joined: ${member.user.tag}`);
  try {
    const role = member.guild.roles.cache.find(r => r.name === DEFAULT_MEMBER_ROLE_NAME);
    if (role) {
      await member.roles.add(role);
      console.log(`  ✅ Auto-assigned role "${DEFAULT_MEMBER_ROLE_NAME}" to ${member.user.tag}`);
    } else {
      console.warn(`  ⚠️ Default member role "${DEFAULT_MEMBER_ROLE_NAME}" not found in guild.`);
    }
  } catch (err) {
    console.error(`💥 Failed to auto-assign default role to ${member.user.tag}:`, err.message || err);
  }
}

/**
 * Publishes/updates the role assignment panel in the `#get-roles` channel
 */
export async function setupRoleSelectionMessage(guild) {
  const getRolesChannel = guild.channels.cache.find(c => c.name.includes('get-roles'));
  if (!getRolesChannel) {
    console.warn("⚠️ Could not find channel containing 'get-roles'.");
    return;
  }

  // Clear existing messages to keep channel clean
  try {
    const fetched = await getRolesChannel.messages.fetch({ limit: 10 });
    if (fetched.size > 0) {
      await getRolesChannel.bulkDelete(fetched);
    }
  } catch (err) {
    console.warn("Could not bulk delete old messages (might be older than 14 days):", err.message);
  }

  const embed = new EmbedBuilder()
    .setColor(0xC96059)
    .setTitle('🎯 WHISPRR Community Role Center')
    .setDescription(
      'Customize your experience in the WHISPRR HQ server by selecting your roles below:\n\n' +
      '🎨 **Community & Platform Roles**\n' +
      'Toggle specialized roles to participate in betas, show your status, or get notified when we ship updates.\n\n' +
      '🌍 **Country Spaces**\n' +
      'Select your country to unlock regional channels and represent your local creator community.'
    )
    .setFooter({ text: 'WHISPRR × CHIMERA — The Ecosystem of Creators' });

  // Buttons for Toggle Roles
  const buttonRow1 = new ActionRowBuilder();
  const buttonRow2 = new ActionRowBuilder();

  // Sort buttons into rows
  let count = 0;
  for (const [customId, config] of Object.entries(TOGGLE_ROLES)) {
    const btn = new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(config.label)
      .setStyle(config.style);

    if (count < 3) {
      buttonRow1.addComponents(btn);
    } else {
      buttonRow2.addComponents(btn);
    }
    count++;
  }

  // Dropdown Select Menu for Countries
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('select_country')
    .setPlaceholder('🌍 Select your home country...')
    .addOptions(
      COUNTRY_ROLES.map(c => ({
        label: c.name,
        value: c.id
      }))
    );

  const selectRow = new ActionRowBuilder().addComponents(selectMenu);

  await getRolesChannel.send({
    embeds: [embed],
    components: [buttonRow1, buttonRow2, selectRow]
  });
  console.log("✅ Role selection message successfully published to #get-roles.");
}

/**
 * Processes incoming button clicks and select menu interactions for roles
 */
export async function handleRoleInteraction(interaction) {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;
  
  const member = interaction.member;
  const guild = interaction.guild;
  if (!member || !guild) return;

  await interaction.deferReply({ ephemeral: true });

  try {
    // 1. Toggle Button Handler
    if (interaction.isButton()) {
      const roleConfig = TOGGLE_ROLES[interaction.customId];
      if (!roleConfig) {
        return interaction.editReply({ content: "❌ Unknown role selection." });
      }

      const role = guild.roles.cache.find(r => r.name === roleConfig.name);
      if (!role) {
        return interaction.editReply({ content: `❌ The role **${roleConfig.name}** does not exist on this server yet.` });
      }

      // Check hierarchy to prevent permission errors
      const botMember = guild.members.me;
      if (role.position >= botMember.roles.highest.position) {
        return interaction.editReply({ content: `❌ I do not have permission to manage the **${role.name}** role (it is higher than mine in hierarchy).` });
      }

      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        return interaction.editReply({ content: `✅ Removed the **${role.name}** role.` });
      } else {
        await member.roles.add(role);
        return interaction.editReply({ content: `✅ Assigned the **${role.name}** role.` });
      }
    }

    // 2. Select Menu Country Handler
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_country') {
      const selectedId = interaction.values[0];
      const countryConfig = COUNTRY_ROLES.find(c => c.id === selectedId);
      if (!countryConfig) {
        return interaction.editReply({ content: "❌ Unknown country selection." });
      }

      const targetRole = guild.roles.cache.find(r => r.name === countryConfig.name);
      if (!targetRole) {
        return interaction.editReply({ content: `❌ The country role **${countryConfig.name}** does not exist on this server.` });
      }

      // Remove existing country roles to enforce only ONE country role
      const countryRoleNames = COUNTRY_ROLES.map(c => c.name);
      const rolesToRemove = member.roles.cache.filter(r => countryRoleNames.includes(r.name) && r.id !== targetRole.id);

      if (rolesToRemove.size > 0) {
        await member.roles.remove(rolesToRemove);
      }

      if (member.roles.cache.has(targetRole.id)) {
        // Toggle off if they select it again
        await member.roles.remove(targetRole);
        return interaction.editReply({ content: `✅ Removed your country space: **${targetRole.name}**.` });
      } else {
        await member.roles.add(targetRole);
        return interaction.editReply({ content: `✅ Set your country space to: **${targetRole.name}**.` });
      }
    }

  } catch (err) {
    console.error("💥 Error during role self-assignment:", err.message || err);
    return interaction.editReply({ content: `💥 An error occurred while modifying your roles: ${err.message || err}` });
  }
}
