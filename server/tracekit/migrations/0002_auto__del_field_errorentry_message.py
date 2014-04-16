# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting field 'ErrorEntry.message'
        db.delete_column(u'tracekit_errorentry', 'message')


    def backwards(self, orm):
        # Adding field 'ErrorEntry.message'
        db.add_column(u'tracekit_errorentry', 'message',
                      self.gf('django.db.models.fields.CharField')(default='changed from charfield to textfield', max_length=255, db_index=True),
                      keep_default=False)


    models = {
        u'tracekit.errorentry': {
            'Meta': {'ordering': "('-timestamp',)", 'object_name': 'ErrorEntry'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'stack_info': ('django.db.models.fields.TextField', [], {}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now', 'db_index': 'True'})
        }
    }

    complete_apps = ['tracekit']