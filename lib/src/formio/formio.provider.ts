import { EnvironmentProviders, inject, provideEnvironmentInitializer, Provider } from '@angular/core';
import { FormioService } from './formio.service';
import { CustomTagsService } from '@formio/angular';

export const provideMaterialFormio = (): Array<Provider | EnvironmentProviders> => {
    return [
        {
            provide: FormioService,
        },
        {
            provide: CustomTagsService
        },
        provideEnvironmentInitializer(() => {
            inject(FormioService)
        })
    ];
};
