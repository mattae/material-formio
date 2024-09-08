import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, inject, Provider } from '@angular/core';
import { FormioService } from './formio.service';
import { CustomTagsService } from '@formio/angular';

export const provideFormio = (): Array<Provider | EnvironmentProviders> => {
    return [
        {
            provide: FormioService,
        },
        {
            provide: CustomTagsService
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => inject(FormioService),
            multi: true,
        },
    ];
};
