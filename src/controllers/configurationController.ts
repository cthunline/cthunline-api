import {
    Router,
    Request,
    Response
} from 'express';

import {
    isRegistrationEnabled,
    isInvitationEnabled
} from '../services/controllerServices/configuration';

const configurationController = Router();

// public configuration
configurationController.get('/configuration', async (req: Request, res: Response): Promise<void> => {
    try {
        res.json({
            registrationEnabled: isRegistrationEnabled(),
            invitationEnabled: isInvitationEnabled()
        });
    } catch (err: any) {
        res.error(err);
    }
});

export default configurationController;
