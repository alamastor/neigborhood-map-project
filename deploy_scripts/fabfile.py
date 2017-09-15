from fabric.contrib.files import exists
from fabric.api import env, local, run

REPO_URL = 'git@github.com:alamastor/neighborhood-map-project.git'

def deploy():
    site_dir = f'~/sites/{env.host}'
    _mkdir(site_dir)
    _update_source(site_dir)
    _npm_install(site_dir)
    _bower_install(site_dir)
    _make(site_dir)


def _mkdir(site_dir):
    if not exists(site_dir):
        run(f'mkdir -p {site_dir}')


def _update_source(site_dir):
    if exists(f'{site_dir}/.git'):
        run(f'cd {site_dir} && git fetch')
    else:
        run(f'git clone {REPO_URL} {site_dir}')
    current_commit = local('git log -n 1 --format=%H', capture=True)
    run(f'cd {site_dir} && git reset --hard {current_commit}')


def _npm_install(site_dir):
    run(f'cd {site_dir} && npm i')


def _bower_install(site_dir):
    run(f'cd {site_dir} && bower install')


def _make(site_dir):
    run(f'cd {site_dir} && grunt')
