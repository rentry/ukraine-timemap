import React from 'react'

import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as actions from '../actions'

import MediaOverlay from './Overlay/Media'
import LoadingOverlay from './Overlay/Loading'
import Map from './Map.jsx'
import Toolbar from './Toolbar/Layout'
import CardStack from './CardStack.jsx'
import NarrativeControls from './presentational/Narrative/Controls.js'
import InfoPopUp from './InfoPopup.jsx'
import Timeline from './Timeline.jsx'
import Notification from './Notification.jsx'
import StaticPage from './StaticPage'
import TemplateCover from './presentational/covers/TemplateCover'

import { parseDate } from '../js/utilities'

import { isMobile } from 'react-device-detect'

class Dashboard extends React.Component {
  constructor (props) {
    super(props)

    this.handleViewSource = this.handleViewSource.bind(this)
    this.handleHighlight = this.handleHighlight.bind(this)
    this.setNarrative = this.setNarrative.bind(this)
    this.moveInNarrative = this.moveInNarrative.bind(this)
    this.handleSelect = this.handleSelect.bind(this)
    this.getCategoryColor = this.getCategoryColor.bind(this)

    this.eventsById = {}
  }

  componentDidMount () {
    if (!this.props.app.isMobile) {
      this.props.actions.fetchDomain()
        .then(domain => this.props.actions.updateDomain(domain))
    }
  }

  handleHighlight (highlighted) {
    this.props.actions.updateHighlighted((highlighted) || null)
  }

  getEventById (eventId) {
    if (this.eventsById[eventId]) return this.eventsById[eventId]
    this.eventsById[eventId] = this.props.domain.events.find(ev => ev.id === eventId)
    return this.eventsById[eventId]
  }

  handleViewSource (source) {
    this.props.actions.updateSource(source)
  }

  handleSelect (selected) {
    if (selected) {
      let eventsToSelect = selected.map(event => this.getEventById(event.id))
      eventsToSelect = eventsToSelect.sort((a, b) => parseDate(a.timestamp) - parseDate(b.timestamp))

      this.props.actions.updateSelected(eventsToSelect)
    }
  }

  getCategoryColor (category) {
    return this.props.ui.style.categories[category] || this.props.ui.style.categories['default']
  }

  getNarrativeLinks (event) {
    const narrative = this.props.domain.narratives.find(nv => nv.id === event.narrative)
    if (narrative) return narrative.byId[event.id]
    return null
  }

  setNarrative (narrative) {
    // only handleSelect if narrative is not null
    if (narrative) {
      this.props.actions.clearFilter('tags')
      this.props.actions.clearFilter('categories')
      this.handleSelect([ narrative.steps[0] ])
    }
    this.props.actions.updateNarrative(narrative)
  }

  moveInNarrative (amt) {
    const { current } = this.props.app.narrativeState
    const { narrative } = this.props.app

    if (amt === 1) {
      this.handleSelect([ narrative.steps[current + 1] ])
      this.props.actions.incrementNarrativeCurrent()
    }
    if (amt === -1) {
      this.handleSelect([ narrative.steps[current - 1] ])
      this.props.actions.decrementNarrativeCurrent()
    }
  }

  render () {
    const { actions, app, domain, ui } = this.props

    if (isMobile || window.innerWidth < 1000) {
      return (
        <div>
          {process.env.features.USE_COVER && (
            <StaticPage showing={app.flags.isCover}>
              {/* enable USE_COVER in config.js features, and customise your header */}
              {/* pass 'actions.toggleCover' as a prop to your custom header */}
              <TemplateCover showAppHandler={() => {
                /* eslint-disable no-undef */
                alert('This platform is not suitable for mobile. Please re-visit the site on a device with a larger screen.')
                /* eslint-enable no-undef */
              }} />
            </StaticPage>
          )}
        </div>
      )
    }

    return (
      <div>
        <Toolbar
          isNarrative={!!app.narrative}
          methods={{
            onTagFilter: tag => actions.toggleFilter('tags', tag),
            onCategoryFilter: category => actions.toggleFilter('categories', category),
            onSelectNarrative: this.setNarrative
          }}
        />
        <Map
          methods={{
            onSelect: this.handleSelect,
            onSelectNarrative: this.setNarrative,
            getCategoryColor: this.getCategoryColor
          }}
        />
        <Timeline
          methods={{
            onSelect: this.handleSelect,
            onUpdateTimerange: actions.updateTimeRange,
            getCategoryColor: category => this.getCategoryColor(category)
          }}
        />
        <CardStack
          onViewSource={this.handleViewSource}
          onSelect={this.handleSelect}
          onHighlight={this.handleHighlight}
          onToggleCardstack={() => actions.updateSelected([])}
          getNarrativeLinks={event => this.getNarrativeLinks(event)}
          getCategoryColor={category => this.getCategoryColor(category)}
        />
        <NarrativeControls
          narrative={app.narrative ? {
            ...app.narrative,
            current: app.narrativeState.current
          } : null}
          methods={{
            onNext: () => this.moveInNarrative(1),
            onPrev: () => this.moveInNarrative(-1),
            onSelectNarrative: this.setNarrative
          }}
        />
        <InfoPopUp
          ui={ui}
          app={app}
          methods={{
            onClose: actions.toggleInfoPopup
          }}
        />
        <Notification
          isNotification={app.flags.isNotification}
          notifications={domain.notifications}
          onToggle={actions.markNotificationsRead}
        />
        {app.source ? (
          <MediaOverlay
            source={app.source}
            onCancel={() => {
              actions.updateSource(null)
            }
            }
          />
        ) : null}
        {process.env.features.USE_COVER && (
          <StaticPage showing={app.flags.isCover}>
            {/* enable USE_COVER in config.js features, and customise your header */}
            {/* pass 'actions.toggleCover' as a prop to your custom header */}
            <TemplateCover showing={app.flags.isCover} showAppHandler={actions.toggleCover} />
          </StaticPage>
        )}
        <LoadingOverlay
          ui={app.flags.isFetchingDomain}
          language={app.language}
        />
      </div>
    )
  }
}

function mapDispatchToProps (dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch)
  }
}

export default connect(
  state => state,
  mapDispatchToProps
)(Dashboard)
