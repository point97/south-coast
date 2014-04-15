# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'ErrorEntry'
        db.create_table('tracekit_errorentry', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('message', self.gf('django.db.models.fields.CharField')(max_length=255, db_index=True)),
            ('timestamp', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now, db_index=True)),
            ('stack_info', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('tracekit', ['ErrorEntry'])


    def backwards(self, orm):
        # Deleting model 'ErrorEntry'
        db.delete_table('tracekit_errorentry')


    models = {
        'tracekit.errorentry': {
            'Meta': {'ordering': "('-timestamp',)", 'object_name': 'ErrorEntry'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'message': ('django.db.models.fields.CharField', [], {'max_length': '255', 'db_index': 'True'}),
            'stack_info': ('django.db.models.fields.TextField', [], {}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now', 'db_index': 'True'})
        }
    }

    complete_apps = ['tracekit']