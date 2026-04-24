import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginId from './pluginId';

export default {
  register(app) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: () => '🧩',
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'Page Builder',
      },
      Component: async () => {
        const component = await import('./pages/PageBuilderPage');
        return component;
      },
      permissions: [],
    });
    app.addMenuLink({
      to: `/plugins/${pluginId}/email-templates`,
      icon: () => '✉️',
      intlLabel: {
        id: `${pluginId}.emailTemplates.name`,
        defaultMessage: 'Email Templates',
      },
      Component: async () => {
        const component = await import('./pages/EmailTemplatesPage');
        return component;
      },
      permissions: [],
    });
    app.registerPlugin({
      id: pluginId,
      name: pluginId,
    });
  },
  bootstrap() {},
  async registerTrads({ locales }) {
    const importedTrads = [];
    for (const locale of locales) {
      try {
        const data = { [`${pluginId}.plugin.name`]: 'Page Builder' };
        importedTrads.push({ data: prefixPluginTranslations(data, pluginId), locale });
      } catch {
        importedTrads.push({ data: {}, locale });
      }
    }
    return importedTrads;
  },
};
