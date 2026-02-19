import $ from 'jquery';
import Ember from 'ember';
import EmberError from '@ember/error';
import Service, {inject as service} from '@ember/service';
import classic from 'ember-classic-decorator';
import {computed, set} from '@ember/object';
import {inject} from 'ghost-admin/decorators/inject';

export function feature(name, options = {}) {
    let {user, onChange} = options;
    let watchedProps = user ? [`accessibility.${name}`] : [`config.${name}`, `labs.${name}`];

    return computed.apply(Ember, watchedProps.concat({
        get() {
            let enabled = false;

            if (user) {
                enabled = this.get(`accessibility.${name}`);
            } else if (typeof this.get(`config.${name}`) === 'boolean') {
                enabled = this.get(`config.${name}`);
            } else {
                enabled = this.get(`labs.${name}`) || false;
            }

            return enabled;
        },
        set(key, value) {
            this.update(key, value, options);

            if (onChange) {
                // value must be passed here because the value isn't set until
                // the setter function returns
                this.get(onChange).bind(this)(value);
            }

            return value;
        }
    }));
}

@classic
export default class FeatureService extends Service {
    @service ghostPaths;
    @service lazyLoader;
    @service notifications;
    @service session;
    @service settings;
    @service store;

    @inject config;

    // features
    @feature('emailAnalytics') emailAnalytics;

    // user-specific flags
    @feature('nightShift', {user: true, onChange: '_setAdminTheme'})
        nightShift;

    // user-specific referral invitation
    @feature('referralInviteDismissed', {user: true}) referralInviteDismissed;

    // labs flags
    @feature('audienceFeedback') audienceFeedback;
    @feature('welcomeEmails') welcomeEmails;
    @feature('webmentions') webmentions;
    @feature('stripeAutomaticTax') stripeAutomaticTax;
    @feature('emailCustomization') emailCustomization;
    @feature('announcementBar') announcementBar;
    @feature('importMemberTier') importMemberTier;
    @feature('lexicalIndicators') lexicalIndicators;
    @feature('editorExcerpt') editorExcerpt;
    @feature('transistor') transistor;
    @feature('tagsX') tagsX;
    @feature('commentModeration') commentModeration;
    _user = null;

    @computed('settings.labs')
    get labs() {
        let labs = this.settings.labs;

        try {
            return JSON.parse(labs) || {};
        } catch (e) {
            return {};
        }
    }

    @computed('_user.accessibility')
    get accessibility() {
        let accessibility = this.get('_user.accessibility');

        try {
            return JSON.parse(accessibility) || {};
        } catch (e) {
            return {};
        }
    }

    get inAdminForward() {
        // Detect if Ember is running inside the React admin shell
        // In React shell: Ember renders to #ember-app
        // Standalone: Ember renders to body (no #ember-app element)
        return document.querySelector('#ember-app') !== null;
    }

    _reconcileAdminForwardState() {
        // Only proceed if we're on a *.ghost.io or *.ghost.is domain
        const hostname = window.location.hostname;
        if (!hostname.endsWith('.ghost.io') && !hostname.endsWith('.ghost.is')) {
            return;
        }

        const cookieName = 'ghost-admin-forward';
        const hasAdminForwardCookie = !!getCookie(cookieName);
        let shouldReload = false;

        // Update cookie based on feature flag and reload only when cookie state changes
        if (hasAdminForwardCookie && !this.adminForward) {
            // User disabled the flag - remove cookie and reload to exit React shell
            deleteCookie(cookieName);
            shouldReload = true;
        } else if (!hasAdminForwardCookie && this.adminForward) {
            // User enabled the flag - set cookie and reload to enter React shell
            setCookie(cookieName, '1', 365);
            shouldReload = true;
        }

        // Only reload when cookie state changes (prevents infinite reload loop)
        // The React shell will wrap Ember on the next load based on the cookie
        if (shouldReload) {
            window.location.reload();
        }
    }

    fetch() {
        return this.settings.fetch().then(() => {
            this.set('_user', this.session.user);
            return this._setAdminTheme().then(() => true);
        });
    }

    update(key, value, options = {}) {
        let serviceProperty = options.user ? 'accessibility' : 'labs';
        let model = this.get(options.user ? '_user' : 'settings');
        let featureObject = this.get(serviceProperty);

        // set the new key value for either the labs property or the accessibility property
        set(featureObject, key, value);

        if (options.requires && value === true) {
            options.requires.forEach((flag) => {
                set(featureObject, flag, true);
            });
        }

        // update the 'labs' or 'accessibility' key of the model
        model.set(serviceProperty, JSON.stringify(featureObject));

        return model.save().then(() => {
            // return the labs key value that we get from the server
            this.notifyPropertyChange(serviceProperty);
            return this.get(`${serviceProperty}.${key}`);
        }).catch((error) => {
            model.rollbackAttributes();
            this.notifyPropertyChange(serviceProperty);

            // we'll always have an errors object unless we hit a
            // validation error
            if (!error) {
                throw new EmberError(`Validation of the feature service ${options.user ? 'user' : 'settings'} model failed when updating ${serviceProperty}.`);
            }

            this.notifications.showAPIError(error);

            return this.get(`${serviceProperty}.${key}`);
        });
    }

    _setAdminTheme(enabled) {
        let nightShift = enabled;

        if (typeof nightShift === 'undefined') {
            nightShift = enabled || this.nightShift;
        }

        document.documentElement.classList.toggle('dark', nightShift ?? false);

        return this.lazyLoader.loadStyle('dark', 'assets/ghost-dark.css', true).then(() => {
            $('link[title=dark]').prop('disabled', !nightShift);
        }).catch(() => {
            //TODO: Also disable toggle from settings and Labs hover
            $('link[title=dark]').prop('disabled', true);
            document.documentElement.classList.remove('dark');
        });
    }
}
