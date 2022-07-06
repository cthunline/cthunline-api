import {
    Router,
    Request,
    Response
} from 'express';

import {
    isRegistrationEnabled,
    isInvitationEnabled,
    configuration
} from '../services/configuration';

const {
    DEFAULT_THEME,
    DEFAULT_LOCALE
} = configuration;

const configurationController = Router();

// public configuration
configurationController.get('/configuration', async (_req: Request, res: Response): Promise<void> => {
    try {
        res.json({
            registrationEnabled: isRegistrationEnabled(),
            invitationEnabled: isInvitationEnabled(),
            defaultTheme: DEFAULT_THEME,
            defaultLocale: DEFAULT_LOCALE
        });
    } catch (err: any) {
        res.error(err);
    }
});

export default configurationController;
