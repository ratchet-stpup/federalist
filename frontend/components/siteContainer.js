import React from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';

import SideNav from './site/SideNav/sideNav';
import PagesHeader from './site/pagesHeader';
import AlertBanner from './alertBanner';

const propTypes = {
  storeState: PropTypes.object,
  params: PropTypes.object, // {id, branch, splat, fileName}
};


function getPageTitle(pathname) {
  return pathname.split('/').pop();
}

function getCurrentSite(sitesState, siteId) {
  if (sitesState.isLoading || !sitesState.data) {
    return null;
  }

  return sitesState.data.find(site => String(site.id) === String(siteId));
}

export class SiteContainer extends React.Component {
  render() {
    const { storeState, children, params, location } = this.props;

    const site = getCurrentSite(storeState.sites, params.id);
    const builds = storeState.builds;
    const buildLogs = storeState.buildLogs;
    const publishedBranches = storeState.publishedBranches;
    const publishedFiles = storeState.publishedFiles;
    const githubBranches = storeState.githubBranches;
    const childConfigs = {
      site,
      builds,
      buildLogs,
      publishedBranches,
      publishedFiles,
      githubBranches,
    };

    const pageTitle = getPageTitle(location.pathname);

    if (!site) {
      return null;
    }

    return (
      <div className="usa-grid site">
        <SideNav siteId={site.id} />
        <div className="usa-width-five-sixths site-main" id="pages-container">
          <AlertBanner
            message={storeState.alert.message}
            status={storeState.alert.status}
          />
          <PagesHeader
            repository={site.repository}
            owner={site.owner}
            title={pageTitle}
            siteId={site.id}
            branch={params.branch || site.defaultBranch}
            fileName={params.fileName}
            viewLink={site.viewLink}
          />
          <div className="usa-grid">
            {children &&
              React.cloneElement(children, childConfigs)
            }
          </div>
        </div>
      </div>
    );
  }
}

SiteContainer.propTypes = propTypes;

export default connect(state => state)(SiteContainer);
