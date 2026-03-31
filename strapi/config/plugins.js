'use strict';

module.exports = ({ env }) => ({
  'ubris-page-builder': {
    enabled: true,
    resolve: './src/plugins/ubris-page-builder',
  },
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('EMAIL_SMTP_HOST', 'smtp.secureserver.net'),
        port: env.int('EMAIL_SMTP_PORT', 587),
        secure: false,
        auth: {
          user: env('EMAIL_SMTP_USER'),
          pass: env('EMAIL_SMTP_PASS'),
        },
        tls: {
          rejectUnauthorized: false,
        },
      },
      settings: {
        defaultFrom: env('EMAIL_FROM_ADDRESS', 'suporte@ubris.com.br'),
        defaultReplyTo: env('EMAIL_FROM_ADDRESS', 'suporte@ubris.com.br'),
      },
    },
  },
});
