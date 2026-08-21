import React from 'react';
import TopLevelGroup from '@/settings/components/top-level-group';
import {Inline} from '@tryghost/shade/primitives';
import {LucideIcon} from '@tryghost/shade/utils';
import {SettingGroupContent, SettingGroupValue, SettingGroupValueContent, SettingGroupValueTitle} from '@tryghost/shade/patterns';
import {useGlobalData} from '@/settings/providers/global-data-context';

const EmailProviderStatus: React.FC<{keywords: string[]}> = ({keywords}) => {
    const {config} = useGlobalData();
    const provider = config.emailProvider;
    const providerName = provider?.active === 'ses' ? 'Amazon SES' : provider?.active === 'mailgun' ? 'Mailgun' : 'Not configured';
    const configurationSource = provider?.configurationSource || `config.${config.environment}.json`;

    return (
        <TopLevelGroup keywords={keywords} navid='email-provider' testId='email-provider' title='Email provider'>
            <SettingGroupContent>
                <SettingGroupValue>
                    <SettingGroupValueTitle>Active provider</SettingGroupValueTitle>
                    <SettingGroupValueContent>
                        <Inline align='center' gap='sm'>
                            {provider?.isConfigured && <LucideIcon.Check className='size-4 text-state-success' />}
                            {providerName}
                        </Inline>
                    </SettingGroupValueContent>
                </SettingGroupValue>
                <SettingGroupValue>
                    <SettingGroupValueTitle>Configuration source</SettingGroupValueTitle>
                    <SettingGroupValueContent>
                        {configurationSource === 'environment' ? 'Environment variables' : <code>{configurationSource}</code>}
                    </SettingGroupValueContent>
                </SettingGroupValue>
            </SettingGroupContent>
        </TopLevelGroup>
    );
};

export default EmailProviderStatus;
