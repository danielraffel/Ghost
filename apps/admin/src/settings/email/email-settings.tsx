import DefaultRecipients from './default-recipients';
import EnableNewsletters from './enable-newsletters';
import EmailProviderStatus from './email-provider-status';
import MailGun from './mailgun';
import Newsletters from './newsletters';
import React from 'react';
import SearchableSection from '@/settings/components/searchable-section';
import {getSettingValues} from '@tryghost/admin-x-framework/api/settings';
import {useGlobalData} from '@/settings/providers/global-data-context';
import {searchKeywords} from './search-keywords';

const EmailSettings: React.FC = () => {
    const {settings, config} = useGlobalData();
    const [newslettersEnabled] = getSettingValues(settings, ['editor_default_email_recipients']) as [string];
    const hasNewslettersEnabled = newslettersEnabled !== 'disabled';
    const hasConfiguredProvider = config.emailProvider?.isConfigured || config.mailgunIsConfigured;
    const hasMailgun = hasNewslettersEnabled && !hasConfiguredProvider;
    const visibleSearchKeywords = [
        searchKeywords.enableNewsletters,
        searchKeywords.emailProvider,
        ...(hasNewslettersEnabled ? [searchKeywords.defaultRecipients, searchKeywords.newsletters] : []),
        ...(hasMailgun ? [searchKeywords.mailgun] : [])
    ].flat();

    return (
        <SearchableSection keywords={visibleSearchKeywords} title='Newsletters'>
            <EmailProviderStatus keywords={searchKeywords.emailProvider} />
            <EnableNewsletters keywords={searchKeywords.enableNewsletters} />
            {hasNewslettersEnabled && (
                <>
                    <DefaultRecipients keywords={searchKeywords.defaultRecipients} />
                    <Newsletters keywords={searchKeywords.newsletters} />
                    {hasMailgun && <MailGun keywords={searchKeywords.mailgun} />}
                </>
            )}
        </SearchableSection>
    );
};

export default EmailSettings;
